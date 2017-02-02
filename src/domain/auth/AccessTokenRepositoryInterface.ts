import AccessTokenEntity from "./AccessTokenEntity";

/**
 * AccessTokenRepository
 *
 * @author keita-nishimoto
 * @since 2016-01-30
 */
export interface AccessTokenRepositoryInterface {

  /**
   * アクセストークンを取得する
   *
   * @param accessToken
   */
  fetch(accessToken: string): Promise<AccessTokenEntity>;
}
