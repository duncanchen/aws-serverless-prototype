import {LambdaEvent} from "../types/aws/types";

/**
 * Environment
 *
 * @author keita-nishimoto
 * @since 2017-02-01
 */
export default class Environment<T extends LambdaEvent> {

  /**
   * constructor
   */
  constructor(private _event: T) {
  }

  /**
   * @returns {LambdaExecutionEvent}
   */
  get event(): T {
    return this._event;
  }

  /**
   * ローカル環境かどうかを判定する
   *
   * @param event
   * @returns {boolean}
   */
  isLocal(): boolean {

    if (this.event.headers.host === "localhost:8000") {
      return true;
    }

    return false;
  }
}
