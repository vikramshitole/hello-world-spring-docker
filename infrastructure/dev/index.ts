import ecs = require('@aws-cdk/aws-ecs');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import ecr = require('@aws-cdk/aws-ecr');
import cdk = require('@aws-cdk/core');


class ECSCluster extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a cluster
    const vpc = new ec2.Vpc(this, 'projectX-dev-vpc', { maxAzs: 2 });

    const asg = new autoscaling.AutoScalingGroup(this, 'ecs-fleet', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      keyName: 'ecs-petclinic',
      machineImage: new ecs.EcsOptimizedAmi(),
      updateType: autoscaling.UpdateType.REPLACING_UPDATE,
      desiredCapacity: 3,
      vpc,
    });

    const cluster = new ecs.Cluster(this, 'projectX-dev-cluster', { vpc });
    cluster.addAutoScalingGroup(asg);
        // create a task definition with CloudWatch Logs
    const logging = new ecs.AwsLogDriver({ streamPrefix: "hello-world" })
    // Create Task Definition
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');
    const repo = ecr.Repository.fromRepositoryName(
      this,
      'hello-howtodoinjava',
      'hello-howtodoinjava'
    );
    const container = taskDefinition.addContainer('hello-world', {
      image: ecs.ContainerImage.fromEcrRepository(repo),
      memoryLimitMiB: 512,
      logging,
        environment: { // clear text, not for sensitive data
          STAGE: 'DEV',
        }
    });

    container.addPortMappings({
      containerPort: 9080,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    // Create Service
    const service = new ecs.Ec2Service(this, "hello-world-service", {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1
    });

    // Create ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });
    const listener = lb.addListener('PublicListener', { port: 80, open: true });

    // Attach ALB to ECS Service
    listener.addTargets('ECS', {
      port: 80,
      targets: [service.loadBalancerTarget({
        containerName: 'hello-world',
        containerPort: 9080
      })],
      // include health check (default is none)
      healthCheck: {
        interval: cdk.Duration.seconds(60),
        path: "/health",
        timeout: cdk.Duration.seconds(5),
      }
    });
  }
}

const app = new cdk.App();
new ECSCluster(app, 'projectX-helloworld-dev-infra');
app.synth();
