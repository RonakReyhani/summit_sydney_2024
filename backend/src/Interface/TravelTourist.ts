export interface ITouristTravel {
    sendEmail(contactEmail: string, s3Url: string): Promise<{message:string}>;
}
