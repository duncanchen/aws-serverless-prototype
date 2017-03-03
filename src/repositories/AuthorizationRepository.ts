import * as request from "request";
import axios from "axios";
import {AxiosResponse} from "axios";
import {AxiosError} from "axios";
import {AuthleteResponse} from "../domain/auth/AuthleteResponse";
import {AuthorizationCodeEntity} from "../domain/auth/AuthorizationCodeEntity";
import {AuthorizationRequest} from "../domain/auth/request/AuthorizationRequest";
import InternalServerError from "../errors/InternalServerError";
import BadRequestError from "../errors/BadRequestError";
import {Logger} from "../infrastructures/Logger";
import {Authlete} from "../config/Authlete";

/**
 * AuthorizationRepository
 *
 * @author keita-nishimoto
 * @since 2017-02-15
 */
export class AuthorizationRepository {

  /**
   * 認可コードを発行する
   *
   * @param authorizationRequest
   * @returns {Promise<AuthorizationCodeEntity>}
   */
  issueAuthorizationCode(authorizationRequest: AuthorizationRequest.Request): Promise<AuthorizationCodeEntity> {
    return new Promise((resolve: Function, reject: Function) => {
      this.issueAuthorizationTicket(authorizationRequest)
        .then((authorizationResponse) => {
          const headers = {
            "Content-Type": "application/json"
          };

          const requestData = {
            ticket: authorizationResponse.ticket,
            subject: authorizationRequest.subject
          };

          const requestConfig = {
            headers: headers,
            auth: {
              username: Authlete.getApiKey(),
              password: Authlete.getApiSecret()
            }
          };

          axios.post("https://api.authlete.com/api/auth/authorization/issue", requestData, requestConfig)
            .then((response: AxiosResponse) => {
              if (response.status !== 200) {
                Logger.critical(response);
                reject(
                  new InternalServerError()
                );
              }

              const authorizationIssueResponse: AuthleteResponse.AuthorizationIssueResponse = response.data;
              const action = authorizationIssueResponse.action.toString();

              switch (action) {
                case "LOCATION":
                  const authorizationCodeEntity = new AuthorizationCodeEntity(authorizationIssueResponse);
                  resolve(authorizationCodeEntity);
                  break;
                case "BAD_REQUEST":
                  reject(
                    new BadRequestError(authorizationIssueResponse.resultMessage)
                  );
                  break;
                default:
                  Logger.critical(authorizationIssueResponse);
                  reject(
                    new InternalServerError(authorizationIssueResponse.resultMessage)
                  );
                  break;
              }
            })
            .catch((error: AxiosError) => {
              Logger.critical(error);
              reject(
                new InternalServerError(error.message)
              );
            });
        })
        .catch((error: Error) => {
          Logger.error(error);
          reject(error);
        });
    });
  }

  /**
   * 認可ticketを発行する
   *
   * @param authorizationRequest
   * @returns {Promise<AuthleteResponse.Authorization>}
   */
  private issueAuthorizationTicket(authorizationRequest: AuthorizationRequest.Request): Promise<AuthleteResponse.Authorization> {
    return new Promise((resolve: Function, reject: Function) => {
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
      };

      const clientId    = authorizationRequest.clientId;
      const state       = authorizationRequest.state;
      const redirectUri = authorizationRequest.redirectUri;

      let scopes = "openid";
      authorizationRequest.scopes.map((scope) => {
        if (scope !== "openid") {
          scopes += "%20" + scope;
        }
      });

      const options = {
        url: "https://api.authlete.com/api/auth/authorization",
        method: "POST",
        auth: {
          username: Authlete.getApiKey(),
          pass: Authlete.getApiSecret()
        },
        json: true,
        headers: headers,
        form: `parameters=client_id%3D${clientId}%26response_type%3Dcode%26state%3D${state}%26scope%3D${scopes}%26redirect_uri=${redirectUri}`
      };

      // axiosに統一したいがパラメータの送り方が特殊な為、requestを使って対応
      request(options, (error: Error, response: any, authorizationResponse: AuthleteResponse.Authorization) => {
        try {
          if (error) {
            Logger.critical(error);
            reject(
              new InternalServerError(error.message)
            );
          }

          if (response.statusCode !== 200) {
            Logger.critical(response);
            reject(
              new InternalServerError()
            );
          }

          const action = authorizationResponse.action.toString();
          switch (action) {
            case "INTERACTION":
              resolve(authorizationResponse);
              break;
            case "BAD_REQUEST":
              reject(
                new BadRequestError(authorizationResponse.resultMessage)
              );
              break;
            case "INTERNAL_SERVER_ERROR":
              Logger.critical(authorizationResponse);
              reject(
                new InternalServerError(authorizationResponse.resultMessage)
              );
              break;
            default:
              reject(
                new InternalServerError(authorizationResponse.resultMessage)
              );
              break;
          }

        } catch (error) {
          Logger.critical(error);
          reject(
            new InternalServerError(error.message)
          );
        }
      });
    });
  }
}
