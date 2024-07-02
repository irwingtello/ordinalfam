const express = require('express');
const axios = require('axios');
require('dotenv').config();
// Import from discord-interactions (no 'dist' folder)

const {
    InteractionType,
    InteractionResponseType,
    verifyKeyMiddleware
} = require('discord-interactions'); 
const app = express();

const CLIENT_PUBLIC_KEY = process.env.CLIENT_PUBLIC_KEY;

const BOT_TOKEN = process.env.BOT_TOKEN;

const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL;
/*
const admin = require('firebase-admin');
Database Feature
var serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  app.post('/retrieve', async (req, res) => {
    try {
       let object;
      const documentX = await admin.firestore().collection('users').doc(req.body.email);
      const userDoc = await documentX.get();
      if (!userDoc.exists) {
        res.status(200).send("No such document!");
      } else {
        let object=userDoc.data();
        for (const key in object) {

            if(req.body.collectioName==key.toString()){
                if (object.hasOwnProperty(key)) {
                    const value = object[key];
                  }
            }

          }
      }
        res.status(200).send(object);

    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  });
*/
app.post('/interactions', verifyKeyMiddleware(CLIENT_PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const commandName = interaction.data.name.toLowerCase();

      if (commandName === 'info') {
          const ordinalId = interaction.data.options[0].value;

          // 1. Immediate Deferral Response
          res.send({ 
              type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE 
          });

          try {
              const ordinalData = await fetchOrdinalData(ordinalId);

              if (!ordinalData) {
                  throw new Error("Ordinal data not found");
              }
              
              const embed = {
                title: 'Ordinal #' + ordinalId.toString(),
                thumbnail: {
                    url: "https://ordinals.com/content/" + ordinalId.toString() // Replace with the actual image URL
                },
                fields: [
                    {
                        name: 'Ordinal ID',
                        value: ordinalId.toString(),
                        inline: true
                    },
                    {
                        name: 'Number',
                        value: ordinalData.number
                    },
                    {
                        name: 'Owner',
                        value: ordinalData.address
                    },
                    {
                        name: 'Content_Type',
                        value: ordinalData.content_type
                    },
                    {
                        name: 'Content_Length',
                        value: ordinalData.content_length
                    },
                    {
                        name: 'Satpoint',
                        value: ordinalData.satpoint
                    },
                    {
                        name: 'Sat',
                        value: ordinalData.sat
                    },
                    {
                        name: 'Fee',
                        value: ordinalData.fee
                    },
                    {
                        name: 'Timestamp',
                        value: ordinalData.timestamp
                    }
                ]
            };

              // 2. Edit Original Response with Ordinal Data
              await axios.patch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
                embeds: [embed]
              }, {
                  headers: { 
                      "Content-Type": "application/json",
                      Authorization: `Bot ${BOT_TOKEN}`,
                  },
              });
          } catch (error) {
              console.error('Error handling ordinal command:', error);

              // 3. Error Response (Edit Original)
              await axios.patch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
                  content: "An error occurred while processing the ordinal information.",
              }, {
                  headers: { 
                      "Content-Type": "application/json",
                      Authorization: `Bot ${BOT_TOKEN}`,
                  },
              });
          }
      } 
  } 
});


  
// Function to fetch Ordinal data (replace with your actual API call)
async function fetchOrdinalData(ordinalId) {
  const apiUrl = QUICKNODE_RPC_URL; 

  const requestData = {
      method: "ord_getInscription",
      params: [ordinalId], // Use the provided ordinalId
      id: 1,
      jsonrpc: "2.0"
  };

  try {
      const response = await axios.post(apiUrl, requestData, {
          headers: { 'Content-Type': 'application/json' }
      });
      return response.data.result; // Assuming the API returns data in the 'result' field
  } catch (error) {
      console.error('Error fetching ordinal data:', error);
      throw error; // Rethrow the error to be handled by the calling code
  }
}

const port = 3000; // Choose a port number

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
