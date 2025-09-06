import { Router } from 'express';

const router = Router();

/* The /webhook with API Type POST is handled by the WhatsApp to redirect messages from the client to our server
*  1. Many Requests from the same user can be batched
*  2. Or previous failed requests are re-send
*  3. We even will get requests when the user view/send messages */
router.post('/webhook', async (req, res) => {
    try {

        // Extracting Main Parts from the Payload
        console.log(req.body);
        const entry = req.body.entry[0];
        const changes = entry.changes[0];
        const contacts = changes.value.contacts[0];
        const messages = changes.value.messages;

        const username = contacts.profile.name;
        const phone_number = contacts.wa_id;

        const isOutBound = changes?.statuses || [];
        if(isOutBound.length === 0){
            return res.status(200).json({
                status: 'success'
            });
        }

        const latest_message = messages[messages.length - 1];
        const message_text = latest_message.text.body;

        return res.status(200);

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



 */