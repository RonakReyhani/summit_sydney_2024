import { travelTouristInstance } from '../Implementation/TravelTouristStore';

interface Parameter {
  name: string;
  type: string;
  value: string;
}

exports.handler = async function (event: any, context: any) {
  console.log('----received event', event);

  let responseCode;
  let responseBody = {};
  const travelStore = travelTouristInstance();
  //  Extract the action group, api path, and parameters from the prediction
  const action = event['actionGroup'];
  const apiPath = event['apiPath'];
  const parameters:Parameter[] = event['parameters'];
  const httpMethod = event['httpMethod'];
  try {
    if (apiPath === "/send-email/{contactEmail}") {
        const contactEmail = parameters.find((p) => p.name === 'contactEmail')?.value;
        const itinerary = parameters.find((p) => p.name === 'itinerary')?.value;
        const sendEmailResp = await travelStore.sendEmail(contactEmail!, itinerary!);
        responseBody = sendEmailResp;
    }else {
        responseCode = 400;
        responseBody = { message: `${action} ${apiPath} is not a valid api, try another one.`}
    }

    console.log('----response body', responseBody);
    const response = {
      'application/json': {
          'body': JSON.stringify(responseBody)
      }
  };
  const action_response = {
    'actionGroup': action,
    'apiPath': apiPath,
    'httpMethod': httpMethod,
    'httpStatusCode': 200,
    'responseBody': response
    }
    const session_attributes = event['sessionAttributes']
    const prompt_session_attributes = event['promptSessionAttributes']
    //  Return the list of responses as a dictionary
    const apiResponse = {
        'messageVersion': '1.0', 
        'response': action_response,
        'sessionAttributes': session_attributes,
        'promptSessionAttributes': prompt_session_attributes
    }
    return apiResponse;


  } catch (e) {
    throw new Error((e as Error).message);
  }
};
