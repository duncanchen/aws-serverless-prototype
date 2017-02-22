# aws-serverless-prototype
Serverless Frameworkを使ったAWS Lambdaプロジェクトの試作品

## 事前準備

### 管理用のIAMユーザーを作成する
serverlessの管理を行う為のIAMユーザーの作成が必要です。

[公式ドキュメント](https://serverless.com/framework/docs/providers/aws/guide/credentials/) に載っているように「AdministratorAccess」権限を持つユーザーを作成しておきます。

次にAccess key IDとSecret access keyをcredentialとして登録します。

[github](https://github.com/serverless/serverless/blob/master/docs/providers/aws/guide/credentials.md) に載っているようにコマンドを使う方法が簡単です。

```bash
serverless config credentials --provider aws --key <your-key-here> --secret <your-secret-key-here>
```

### Authleteのアカウントを作成する
[Authlete](https://www.authlete.com) はOAuth2.0 サーバーとOpenIDConnectプロバイダーをクラウド上で構築出来るサービスです。

本システムでは[AmazonAPIGateway Custom Authorization](http://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/use-custom-authorizer.html) を利用して[Authlete](https://www.authlete.com) のアクセストークンでAPIリソースを保護しています。

つまりAPIの呼び出しには [Authlete](https://www.authlete.com) のアクセストークンが必須になります。

### AuthleteのAPIキーとAPIシークレットを入手する

[サービス管理者コンソール](https://so.authlete.com/accounts/login?locale=ja) にログインを行い確認して下さい。

確認した値は控えておき、環境変数に設定を行います。（これは後に説明します。）

### 各種環境変数の設定

動作に必要な環境変数を設定します。

以下は.bash_profileへの設定例です。

```bash
echo export SLS_DEBUG=true >> ~/.bash_profile
echo export DEPLOY_STAGE=dev >> ~/.bash_profile
echo export AUTHLETE_API_KEY=YOUR API KEY >> ~/.bash_profile
echo export AUTHLETE_API_SECRET=YOUR API SECRET >> ~/.bash_profile
source ~/.bash_profile
```

- DEPLOY_STAGEは特に重要です、これがそのままデプロイ先の環境を指します。（例ではdevですがステージングはstg、本番はprd等状況に合わせて値を設定して下さい。）
- SLS_DEBUGは必須ではありませんがServerless Frameworkに問題が発生した場合に詳細なエラーが分かるので設定しておく事を推奨します。
- AUTHLETE_API_KEYにはAuthleteのAPIキーを設定して下さい。これはLambdaの環境変数として設定され、アクセストークンの検証時に利用されます。
- AUTHLETE_API_SECRETにはAuthleteのAPIシークレットを設定して下さい。これはLambdaの環境変数として設定され、アクセストークンの検証時に利用されます。


### Authleteのアクセストークン発行方法

Authleteでは、```https://api.authlete.com/api/auth/authorization/direct/{service-api-key}``` というURLで認可エンドポイントのデフォルト実装を提供しています (デフォルトで利用可能になっています)。

最も簡単な方法は以下のURLにブラウザでアクセスして[インプシリットフロー](https://tools.ietf.org/html/rfc6749#section-4.2) でアクセストークンを取得する事です。

下記が接続の例になります。

```
https://api.authlete.com/api/auth/authorization/direct/{service-api-key}?client_id={client-id}&response_type=token
```

表示される認可画面のログインフォームには、あなたのAPIキーとAPIシークレットを入力して下さい。

アクセストークン取得方法のさらに詳しい方法に関しては [Getting Started](https://www.authlete.com/documents/getting_started) を見て下さい。

## How to use

サンプル用の各APIの呼び出し方法です。

各APIの呼出にはアクセストークンによる認可が必要です。
AuthorizationHeaderにアクセストークンを設定して下さい。

以下はcurlでの接続例です。
"YOUR ACCESS TOKEN"の部分をあなたが取得したアクセストークンに置き換えて下さい。

### findClient

```bash
curl -kv \
-H "Authorization: Bearer YOUR ACCESS TOKEN" \
https://XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/clients/{id}
```

### userCreate

```bash
curl -X POST -kv \
-H "Content-type: application/json" \
-H "Authorization: Bearer YOUR ACCESS TOKEN" \
-d \
'
{
  "email":"keita@gmail.com",
  "password": "MyPassword",
  "name": "keita",
  "gender": "male",
  "birthdate": "1990-01-01"
}
' \
https://XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/users
```

### findUser

```bash
curl -kv \
-H "Authorization: Bearer YOUR ACCESS TOKEN" \
https://XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/users/{id}
```

### authentication

```bash
curl -kv \
-X POST \
-H "Content-type: application/json" \
-d \
'
{
  "id": "{userId}",
  "password": "{userPassword}"
}
' \
https://XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/auth/authentication
```

### issueAuthorizationCode

```bash
curl -kv \
-X POST \
-H "Content-type: application/json" \
-d \
'
{
  "client_id": AuthleteClientId,
  "state": "XXXXXXXXXXXXXXXXXXX",
  "redirect_uri": "https://your-redirect-uri",
  "subject": "{userId}",
  "scopes": ["openid", "email"]
}
' \
https://XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/auth/authorization/code
```

### issueTokenFromCode

```bash
curl -kv \
-X POST \
-H "Content-type: application/json" \
-d \
'
{
  "code": "Your AuthorizationCode",
  "redirect_uri": "https://your-redirect-uri"
}
' \
https://XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/tokens/code
```

### createResource

```bash
curl -kv \
-X POST \
-H "Content-type: application/json" \
-d \
'
{
  "http_method": "POST",
  "resource_path": "users",
  "name": "Create User.",
  "scopes": ["email"]
}
' \
https://XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/resource
```

# ローカル環境でデバッグを行う方法

[こちらのページ](https://github.com/keita-nishimoto/aws-serverless-prototype/wiki/Run-In-Local-Environment) を参考に必要なテーブルをローカル内のDynamoDBに作成して下さい。

※DynamoDBのポートは必ず9000で起動する必要があります。

また、ローカルでデバッガーを利用する為には [こちらの記事](http://qiita.com/keita-nishimoto/items/9c27bfcd1e67c0dc4ad1) を参考にして下さい。

## AWS services used

- Lambda
- API Gateway
- DynamoDB

## Other services used

- [Authlete](https://www.authlete.com)
