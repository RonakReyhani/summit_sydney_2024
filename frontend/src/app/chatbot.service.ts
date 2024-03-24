import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { BedrockAgentRuntimeClient, InvokeAgentCommand, Trace } from '@aws-sdk/client-bedrock-agent-runtime';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  async invokeAgent(prompt: string, sessionId: string) {
    const client = new BedrockAgentRuntimeClient({
      region: environment.region,
      credentials: {
        accessKeyId: environment.accessKeyId,
        secretAccessKey: environment.secretAccessKey,
      },
    });

    let agentId = environment.agentID;
    let agentAliasId = environment.agentAliasID;

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      inputText: prompt,
      enableTrace: true,
    });

    try {
      let completion = '';
      let trace: Trace | undefined;
      const response = await client.send(command);

      if (response.completion === undefined) {
        throw new Error('Completion is undefined');
      }

      for await (let chunkEvent of response.completion) {
        let chunk: any;
        chunk = chunkEvent.chunk;
        const decodedResponse = new TextDecoder('utf-8').decode(chunk?.bytes);
        completion += decodedResponse;
        trace = chunkEvent.trace?.trace;
        if (trace) {
          if (trace.preProcessingTrace?.modelInvocationOutput?.parsedResponse) {
            console.log(
              'Preprocessing Trace IsValid:\n',
              trace?.preProcessingTrace?.modelInvocationOutput?.parsedResponse?.isValid,
            );
            console.log(
              'Preprocessing Trace Rationale:\n',
              trace?.preProcessingTrace?.modelInvocationOutput?.parsedResponse?.rationale,
            );
          }
          if (trace?.orchestrationTrace?.rationale) {
            console.log('Orchestration rationale Trace:\n', trace?.orchestrationTrace?.rationale?.text);
          }
          if (trace?.orchestrationTrace?.observation?.finalResponse) {
            console.log(
              'Orchestration observation Trace:\n',
              trace?.orchestrationTrace?.observation?.finalResponse?.text,
            );
          }
          if (trace?.orchestrationTrace?.observation?.knowledgeBaseLookupOutput) {
            console.log(
              'Orchestration observation Knowledge Base Content Trace:\n',
              trace?.orchestrationTrace?.observation?.knowledgeBaseLookupOutput?.retrievedReferences?.map(
                (x) => x.content?.text,
              ),
            );
            console.log(
              'Orchestration observation Knowledge Base Location Trace:\n',
              trace?.orchestrationTrace?.observation?.knowledgeBaseLookupOutput?.retrievedReferences?.map(
                (x) => x.location?.s3Location,
              ),
            );
          }
          if (trace?.orchestrationTrace?.observation?.actionGroupInvocationOutput) {
            console.log(
              'Orchestration observation Action Group Trace:\n',
              trace?.orchestrationTrace?.observation?.actionGroupInvocationOutput?.text,
            );
          }
        }
      }
      return completion;
    } catch (err) {
      console.error(err);
      return 'Something went wrong. Please try later.';
    }
  }
}
