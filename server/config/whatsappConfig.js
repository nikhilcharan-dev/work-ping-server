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
        const changes = entry.changes[0];
        const contacts = changes[0].contacts;
        const messages = changes[0].messages;

        const username = contacts.profile.name;
        const phone_number = contacts.profile.wa_id;

        const message = messages[messages.length - 1];

        console.log("From: ", username, " With number: ", phone_number)
        console.log("Got Message: ", message)
    } catch(err) {
        console.log(err);
    }
})

export default router;

/*  {
    "object":"whatsapp_business_account",
    "entry": [ { "id":"755604307393380",
                 "changes": [
                    { "value": { "messaging_product": "whatsapp",
                          "contacts": [
                            {
                                "profile": {
                                    "name":"Lova Reddy Dwarampudi"
                                    },
                                    "wa_id":"917337252906"
                                    }
                            ],
                            "messages": [
                              {
                                   "from":"917337252906",
                                   "id":"wamid.HBgMOTE3MzM3MjUyOTA2FQIAEhgUM0ZCQjdBOUU0N0Y0N0VFQkI5RTkA",
                                   "timestamp":"1756877352",
                                   "text":{"body":"Hi"},
                                   "type":"text"
                               }
                             ]
                      },
                      "field":"messages"
                      }]
              }
        ]
} */