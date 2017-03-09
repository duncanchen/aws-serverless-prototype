import {DynamoDB} from "aws-sdk";
import {ResourceRepositoryInterface} from "../domain/resource/ResourceRepositoryInterface";
import {ResourceEntity} from "../domain/resource/ResourceEntity";
import {DynamoDbResponse} from "./DynamoDbResponse";
import NotFoundError from "../errors/NotFoundError";
import InternalServerError from "../errors/InternalServerError";
import {Logger} from "../infrastructures/Logger";

/**
 * ResourceRepository
 *
 * @author keita-nishimoto
 * @since 2017-02-14
 */
export class ResourceRepository implements ResourceRepositoryInterface {

  /**
   * constructor
   *
   * @param dynamoDbDocumentClient
   */
  constructor(private dynamoDbDocumentClient: DynamoDB.DocumentClient) {
  }

  /**
   * リソースを取得する
   *
   * @param resourceId
   * @returns {Promise<ResourceEntity>}
   */
  find(resourceId: string): Promise<ResourceEntity> {
    return new Promise<ResourceEntity>((resolve: Function, reject: Function) => {
      const params = {
        TableName: this.getResourcesTableName(),
        Key: {
          id: resourceId
        }
      };

      this.dynamoDbDocumentClient
        .get(params)
        .promise()
        .then((dbResponse: DynamoDbResponse.Resource) => {
          if (Object.keys(dbResponse).length === 0) {
            return reject(new NotFoundError());
          }

          const resourceEntity = new ResourceEntity(dbResponse.Item.id, dbResponse.Item.created_at);
          resourceEntity.httpMethod = dbResponse.Item.http_method;
          resourceEntity.resourcePath = dbResponse.Item.resource_path;
          resourceEntity.name = dbResponse.Item.name;
          resourceEntity.scopes = dbResponse.Item.scopes;
          resourceEntity.updatedAt = dbResponse.Item.updated_at;

          resolve(resourceEntity);
        })
        .catch((error: Error) => {
          Logger.critical(error);
          return reject(
            new InternalServerError(error.message)
          );
        });
    });
  }

  /**
   * リソースを保存する
   *
   * @param resourceEntity
   * @returns {Promise<ResourceEntity>}
   */
  save(resourceEntity: ResourceEntity): Promise<ResourceEntity> {
    return new Promise<ResourceEntity>((resolve: Function, reject: Function) => {
      const resourceCreateParams = {
        id: resourceEntity.id,
        http_method: resourceEntity.httpMethod,
        resource_path: resourceEntity.resourcePath,
        name: resourceEntity.name,
        scopes: resourceEntity.scopes,
        created_at: resourceEntity.createdAt,
        updated_at: resourceEntity.updatedAt
      };

      const params = {
        TableName: this.getResourcesTableName(),
        Item: resourceCreateParams
      };

      this.dynamoDbDocumentClient
        .put(params)
        .promise()
        .then(() => {
          return resolve(resourceEntity);
        })
        .catch((error: Error) => {
          Logger.critical(error);
          return reject(
            new InternalServerError(error.message)
          );
        });
    });
  }

  /**
   * リソースを削除する
   *
   * @param resourceId
   * @returns {Promise<void>}
   */
  destroy(resourceId: string): Promise<void> {
    return new Promise<void>((resolve: Function, reject: Function) => {
      const params = {
        TableName: this.getResourcesTableName(),
        Key: {
          id: resourceId
        }
      };

      this.dynamoDbDocumentClient
        .delete(params)
        .promise()
        .then(() => {
          return resolve();
        })
        .catch((error) => {
          Logger.critical(error);
          return reject(error);
        });
    });
  }

  /**
   * 実行環境のResourcesテーブル名を取得する
   *
   * @returns {string}
   */
  private getResourcesTableName() {
    return process.env.RESOURCES_TABLE_NAME;
  }
}
