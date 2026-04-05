import { Client, Account, Databases, ID, Query } from 'react-native-appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('69d267220004241d425e')
  .setPlatform('com.cody.symptomjournal');

export const account = new Account(client);
export const databases = new Databases(client);

export const DB_ID = '69d26800000cf4ce08b1';

export const COLLECTIONS = {
  entries:       'entries',
  foodTags:      'food_tags',
  medications:   'medications',
  customFields:  'custom_fields',
  customValues:  'custom_values',
  insights:      'insights',
};

export { ID, Query };