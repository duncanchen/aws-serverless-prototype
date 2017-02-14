/**
 * DynamoDbResponse
 *
 * @author keita-nishimoto
 * @since 2016-02-03
 */
export namespace DynamoDbResponse {

  /**
   * ClientsテーブルのResponse
   */
  export interface Client {
    Item: {
      id: string;
      secret: string;
      name: string;
      redirect_uri: string;
      created_at: number;
      updated_at: number;
    }
  }

  /**
   * UsersテーブルのResponse
   */
  export interface User {
    Item: {
      id: string;
      email: string;
      email_verified: number;
      password_hash: string;
      name: string;
      gender: string;
      birthdate: string;
      created_at: number;
      updated_at: number;
    }
  }

  /**
   * ResourcesテーブルのResponse
   */
  export interface Resource {
    Item: {
      id: string;
      http_method: string;
      resource_path: string;
      name: string;
      scopes: [string];
      created_at: number;
      updated_at: number;
    }
  }
}