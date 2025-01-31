import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'AppVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'AppCluster', {
      vpc,
      containerInsights: true,
    });

    // Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'AppLB', {
      vpc,
      internetFacing: true,
    });

    // HTTPS Listener
    const certificate = new acm.Certificate(this, 'AppCert', {
      domainName: 'app.example.com',
      validation: acm.CertificateValidation.fromDns(),
    });

    const listener = lb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    // Fargate Service
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'AppTask', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromAsset('../'),
      environment: {
        NODE_ENV: 'production',
        MONGODB_URI: cdk.SecretValue.secretsManager('mongodb-uri').toString(),
      },
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'app',
      }),
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    const service = new ecs.FargateService(this, 'AppService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [
        new ec2.SecurityGroup(this, 'AppServiceSG', {
          vpc,
          description: 'Security group for App Fargate Service',
          allowAllOutbound: true,
        }),
      ],
    });

    // Target Group
    const targetGroup = listener.addTargets('AppTG', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/health',
        timeout: cdk.Duration.seconds(5),
        interval: cdk.Duration.seconds(30),
      },
    });

    // Route 53 DNS
    const zone = route53.HostedZone.fromLookup(this, 'AppZone', {
      domainName: 'example.com',
    });

    new route53.ARecord(this, 'AppDNS', {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(lb)
      ),
      recordName: 'app.example.com',
    });

    // Output the Load Balancer DNS
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: lb.loadBalancerDnsName,
    });
  }
}