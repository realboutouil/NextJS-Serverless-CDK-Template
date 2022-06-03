import * as path from 'path';
import { Construct } from 'constructs';
import { Builder } from '@sls-next/lambda-at-edge';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as sls_next from '@sls-next/cdk-construct';
import { createARecordForDistribution, getHostedZone } from './helpers';

// The builder wraps nextJS in Compatibility layers for Lambda@Edge; handles the page
// manifest and creating the default-lambda and api-lambda. The final output is an assets
// folder which can be uploaded to s3 on every deploy.
const nextConfigDir = '../application';
const cwd = path.join(process.cwd(), nextConfigDir);
const outputDir = path.join(nextConfigDir, '.serverless_nextjs');

const options = {
  cmd: path.join(cwd, '/node_modules/.bin/next'),
  cwd: cwd,
  env: {},
  args: ['build'],
};

const builder = new Builder(nextConfigDir, outputDir, options);

interface Props extends cdk.StackProps {
  certArn: string;
  domainName: string;
  subDomainName: string;
}

export default class DefaultStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { certArn, domainName, subDomainName } = props;
    builder
      .build(true)
      .then(() => {
        // Next lets lookup and grab a reference to our hosted zone in Route53
        const hostedZone = getHostedZone({
          scope: this,
          domainName,
        });

        // Now we want to get an SSL certificate for our url under the hosted
        // This will allow us to securely server content from our CloudFront Distribution
        const certificate = acm.Certificate.fromCertificateArn(this, 'certificate-lookup', certArn);

        // Build NextJS deployment using @sls-next/lambda-at-edge construct
        const { distribution } = new sls_next.NextJSLambdaEdge(this, 'nextjs-lambda-edge', {
          serverlessBuildOutDir: outputDir,
          description: `Serverless ${id} NextJs Lambda Function Built on ${new Date().toISOString()}`,
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: cdk.Duration.seconds(30),
          withLogging: true,
          memory: 1024,
          name: {
            apiLambda: `${id}-Api`,
            defaultLambda: `Fn-${id}`,
            imageLambda: `${id}-Image`,
          },
          s3Props: {
            autoDeleteObjects: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          },
          cloudfrontProps: {
            domainNames: [subDomainName],
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            certificate,
          },
          defaultBehavior: {
            compress: true,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        });

        // Create an A record entry in Route53 that points to our CloudFront distribution
        // E.g. site.example.com ==> xyz.cloudfront.net
        createARecordForDistribution({
          scope: this,
          hostedZone,
          subDomainName,
          distribution,
        });

        new cdk.CfnOutput(this, 'DistributionID', {
          value: distribution.distributionId,
          description: 'DistributionID',
        });

        new cdk.CfnOutput(this, 'DistributionDomain', {
          value: `https://${distribution.distributionDomainName}`,
          description: 'CloudFrontDomain',
        });

        new cdk.CfnOutput(this, 'ARecordDomain', {
          value: `https://${subDomainName}`,
          description: 'ARecordDomain',
        });
      })
      .catch((err) => {
        console.warn('Build failed for NextJS, aborting CDK operation');
        console.error({ err });
        throw err;
      });
  }
}
