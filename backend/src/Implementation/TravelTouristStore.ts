import { ITouristTravel } from '../Interface/TravelTourist';
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { v4 as uuidv4 } from "uuid"
let instance: ITouristTravel;

const REGION = `${process.env.AWS_REGION}`;

export function travelTouristInstance(): ITouristTravel {
    /* istanbul ignore next */
    if (!instance) {
        const s3Client = new S3Client({ region: REGION });
        const sesClient = new SESClient({ region: REGION });
        instance = new TouristTravelDB(s3Client, sesClient);
    }
    return instance;
}

class TouristTravelDB implements ITouristTravel {
    private readonly bucketName: string;

    constructor(private s3Client: S3Client, private sesClient: SESClient) {
        this.bucketName = `${process.env.BUCKET}`;

    }

    // ----------- CLASS METHODS -----------------------------------//
    private async generatePresignedUrl(key: string) {
        try {
            const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
            const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 15 * 60 * 60 });
            console.log("Presigned URL:", presignedUrl);
            return {presignedUrl: presignedUrl};
        } catch (err) {
            console.error("Error generating presigned URL:", err);
            throw err;
        }
    }

    private async uploadFileToS3(itinerary: string, key: string) {
        const params = {
            Bucket: this.bucketName,
            Key: key,
            body: itinerary
        };

        const command = new PutObjectCommand(params);

        try {
            await this.s3Client.send(command);
            console.log(`File uploaded successfully`);
            // Return the uploaded file key
            return {fileKey: key};
        } catch (err) {
            console.error("Error uploading file:", err);
            throw err;
        }
    }

    public async sendEmail(contactEmail: string, itinerary: string) {
        const uuid = uuidv4();
        const fileName = `summary-${uuid}.txt`
        const key = `summary/${fileName}`

        await this.uploadFileToS3(itinerary, key);
        const presignedUrl = await this.generatePresignedUrl(key);
        if (typeof contactEmail == "undefined") {
            return {message: "I need your email address for sharing the itinerary."};
        }
        console.log("contactEmail", contactEmail);
        let params = {
            Destination: {
                ToAddresses: [contactEmail],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `<!DOCTYPE html><html><head><title>Welcome to Travel&Tourist Assistant!</title></head><body><h1>It was great chatting with you!</h1><p>I have prepared the summary of recommended itinerary for you.</p><p>To download the summary from provided link: <a href="${presignedUrl}">Download Summary</a></p><p>Remember The link is valid for 15 min. Please download the summary before it expires. I wish you an amazing time if you decide to go on this trip.</p></body></html>`,
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "Welcome to Travel&Tourist Assistant!. It was great chatting with you! I have prepared the summary of recommended itinerary for you. Remember The link is valid for 15 min, Please download the summary before it expires. I wish you an amazing time if you decide to go on this trip.",
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Your Itinerary Summary",
                },
            },
            Source: "<YOUR_SOURCE_EMAIL_HERE>",
        };
        try {
            const sendEmailCommand = new SendEmailCommand(params);
            const result = await this.sesClient.send(sendEmailCommand);
            console.log("Email sent successfully", result.MessageId);
            return { message:"Your Itinerary has been submitted successfully. Place Check your email Inbox."}
        } catch (e) {
            console.log("error", e )
            throw new Error((e as Error).message);
        }
    }
}
