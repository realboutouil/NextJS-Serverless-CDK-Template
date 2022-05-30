#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import DefaultStack from './stack';
import * as process from 'process';

const app = new cdk.App();

const certArn = app.node.tryGetContext('certArn');
const domainName = app.node.tryGetContext('domainName');
const subDomainName = app.node.tryGetContext('subDomainName');
const environment = app.node.tryGetContext('environment');

const stackName = `nextjs-aws-cdk-template-${environment}`;
cdk.Tags.of(app).add('application', stackName);
cdk.Tags.of(app).add('environment', environment);

new DefaultStack(app, stackName, {
  certArn,
  domainName,
  subDomainName,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
