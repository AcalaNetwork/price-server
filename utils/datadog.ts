import { v1 } from '@datadog/datadog-api-client';
import { EventCreateRequest } from '@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/EventCreateRequest';

let isAuth = false;

const configuration = v1.createConfiguration();
const apiInstance = new v1.AuthenticationApi(configuration);
const event = new v1.EventsApi(configuration);

export const auth = () => apiInstance.validate().then((data: any) => {
  isAuth = true;
  console.log(data)
}).catch(err => {
  isAuth = false;
  console.log("NO DATADOG KEY!")
});

export const postEvent = async (body: EventCreateRequest) => {
  if(!isAuth) return;
  try {
    const eventRes = await event.createEvent({body});
    console.log(`post event status: [${eventRes.status}]`);
  } catch (error) {
    console.log(error)
  }
}