import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsService {
  private awsS3: AWS.S3;

  constructor() {
    this.awsS3 = new AWS.S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      region: process.env.AWS_S3_REGION,
    });
  }

  async uploadFileToS3(
    file: Express.Multer.File,
    filepath: string,
    bucketName: string,
    region: string,
  ) {
    // console.log(bucketName);
    const key = `${filepath}/${Date.now()}_${file.originalname.replace(
      / /g,
      '',
    )}`;
    try {
      await this.awsS3
        .putObject({
          Bucket: bucketName,
          Key: key,
          Body: file.buffer,
          // ACL: 'public-read',
          ContentType: file.mimetype,
        })
        .promise();
      return `https://${bucketName}.s3-${region}.amazonaws.com/${key}`;
    } catch (e) {
      throw new InternalServerErrorException(
        `AWS-S3 upload fail: ${e.message}`,
      );
    }
  }
}
