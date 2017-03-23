import * as sourceMapSupport from "source-map-support";
import * as lambda from "aws-lambda";
import Environment from "../infrastructures/Environment";
import AccessTokenRepository from "../repositories/AccessTokenRepository";
import ErrorResponse from "../domain/ErrorResponse";
import {SuccessResponse} from "../domain/SuccessResponse";
import {TokenValidationService} from "../domain/token/TokenValidationService";
import {ValidationErrorResponse} from "../domain/ValidationErrorResponse";
import {RequestFactory} from "../factories/RequestFactory";
import {TokenRequest} from "../domain/token/request/TokenRequest";
import AuthleteHttpClientFactory from "../factories/AuthleteHttpClientFactory";

sourceMapSupport.install();

const axiosInstance = AuthleteHttpClientFactory.create();

/**
 * 認可コードからアクセストークンを発行する
 *
 * @param event
 * @param context
 * @param callback
 * @returns {Promise<void>}
 */
export const issueTokenFromCode = async (
  event: lambda.APIGatewayEvent,
  context: lambda.Context,
  callback: lambda.Callback
): Promise<void> => {
  try {
    const environment = new Environment(event);
    const requestFactory = new RequestFactory(event, environment.isLocal());
    const request: TokenRequest.IssueTokenFromCodeRequest = requestFactory.create();

    const validateResultObject = TokenValidationService.issueTokenFromCodeValidate(request);
    if (Object.keys(validateResultObject).length !== 0) {
      const validationErrorResponse = new ValidationErrorResponse(validateResultObject);
      callback(undefined, validationErrorResponse.getResponse());
      return;
    }

    const authorizationCode = request.code;
    const redirectUri       = request.redirect_uri;

    const accessTokenRepository = new AccessTokenRepository(axiosInstance);

    const accessTokenEntity = await accessTokenRepository.issue(authorizationCode, redirectUri);

    const successResponse = new SuccessResponse(
      accessTokenEntity.tokenResponse.responseContent,
      201
    );

    callback(undefined, successResponse.getResponse(false));
  } catch (error) {
    const errorResponse = new ErrorResponse(error);
    const response = errorResponse.getResponse();

    callback(undefined, response);
  }
};
