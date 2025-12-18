import { Router } from 'express';

const router = Router();

/* The /webhook with API Type POST is handled by the WhatsApp to redirect messages from the client to our server
*  0. There are InBound & OutBound messages/notifications
*  1. Many Requests from the same user can be batched
*  2. Or previous failed requests are re-send
*  3. We even will get requests when the user view/read/send/delete messages */
router.post('/webhook', async (req, res) => {
    try {

        // Extracting Main Parts from the Payload
        const entry = req.body.entry[0];
        const changes = entry.changes[0];
        const value = changes.value;

        // Handling OutBound Messages
        const statuses = value?.statuses || [];
        if(statuses.length !== 0){
            const status = statuses[0].status;

            if(status === 'failed') {
                const ID = statuses[0].id;
                const errorMessage = statuses[0]?.errors[0]?.error_data || statuses[0].errors[0].title;
                console.log(`Message Failed for Conversion ID: ${ID}.\n With Error: ${JSON.stringify(errorMessage)}`);

                return res.status(500).json({
                    status: 'error',
                })
            }

            console.log(`Message Status: ${status}`);
            return res.status(200).json({
                status: 'success'
            });
        }

        const contacts = changes.value.contacts[0];
        const messages = changes.value.messages;

        const username = contacts.profile.name;
        const phone_number = contacts.wa_id;

        const latest_message = messages[messages.length - 1];
        const message_text = latest_message.text.body;

        console.log(message_text);

        return res.status(200).json({
            message: 'Message sent!',
        });

    } catch(err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal Server Error'
        });
    }
})

export default router;



/*
    Example POST /webhook body
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "755604307393380",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551468079",
              "phone_number_id": "735313653000706"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Nikhil"
                },
                "wa_id": "917815873262"
              }
            ],
            "messages": [
              {
                "from": "917815873262",
                "id": "wamid.HBgMOTE3ODE1ODczMjYyFQIAEhgUM0Y4MzFCMkFDOUQ2MkFDQTE1OTAA",
                "timestamp": "1756881698",
                "text": {
                  "body": "Heyyy"
                },
                "type": "text"
              }
            ]
          },
          <!-- only included with sent status, and one of either delivered or read status -->
                "pricing": {
                  "billable": <IS_BILLABLE?>,
                  "pricing_model": "<PRICING_MODEL>",
                  "type": "<PRICING_TYPE>",
                  "category": "<PRICING_CATEGORY>"
                },
          "field": "messages"
        }
      ]
    }
  ]
}

RESTs API
sender receiver
req    res

onEvent (web services)    receiver



 */