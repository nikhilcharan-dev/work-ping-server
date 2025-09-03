import { Router } from 'express';

const router = Router();

router.get('/webhook', async (req, res) => {
    try {
        console.log(req.query);
        if(req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
            return res.status(200).send(req.query['hub.challenge'])
        }
        return res.status(400);
    } catch(err) {
        console.log(err);
        return res.status(500);
    }
})

router.post('/webhook', async (req, res) => {
    try {
        console.log(JSON.stringify(req.body));

        const entry = req.body.entry[0];
        // entry[0].changes[0].value.contacts[0]
        const changes = entry.changes[0];
        const contacts = changes[0].value.contacts[0];
        const messages = changes[0].value.messages;

        const username = contacts.profile.name;
        const phone_number = contacts.wa_id;

        const message = messages[messages.length - 1];

        console.log("From: ", username, " With number: ", phone_number)
        console.log("Got Message: ", message)
    } catch(err) {
        console.log(err);
    }
})

export default router;

/*
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
          "field": "messages"
        }
      ]
    }
  ]
}

 */