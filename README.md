# NextJS Serverless CDK Template

A CDK deploy to cloudfront distributions of https://github.com/vercel/next.js
using https://github.com/serverless-nextjs/serverless-next.js for AWS compatibility.

## Deploy

- Deploys to `us-east-1`
- Uses cloudformation single stack
  as [resource limit has recently be raised from 200 to 500](https://aws.amazon.com/about-aws/whats-new/2020/10/aws-cloudformation-now-supports-increased-limits-on-five-service-quotas/#:~:text=AWS%20CloudFormation%20now%20supports%20increased%20limits%20on%20five%20service%20quotas,-Posted%20On%3A%20Oct&text=Oct%2022%2C%202020-,AWS%20CloudFormation%20now%20supports%20increased%20limits%20on%20five%20service%20quotas,now%201MB%20(previously%20450KB).)
- Configure [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)
```
npm install -g pnpm

pnpm install

pnpm run deploy
```

## Removing

```
pnpm run destory
```
