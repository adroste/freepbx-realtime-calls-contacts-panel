import express from 'express';
import { getConfig } from '../config';
import { getExpress } from '../web-server';
import { getPhonebookFanvilXml } from '../func/phonebook-fanvil';
import { getPhonebookYealinkXml } from '../func/phonebook-yealink';
import { resolveCaller } from '../func/caller-id';

const TAG = '[HTTP API]';

export function initHttpApi() {
  const app = getExpress();

  // static content
  app.use('/callpanel/' , express.static(getConfig().frontendBuildDir));

  // api
  app.get('/callpanel/fanvil-phonebook.xml', (_, res) => {
    res.setHeader('content-type', 'text/xml');
    res.send(getPhonebookFanvilXml());
  });

  app.get('/callpanel/yealink-phonebook.xml', (_, res) => {
    res.setHeader('content-type', 'text/xml');
    res.send(getPhonebookYealinkXml());
  });

  app.get('/callpanel/lookupcallerid', (req, res) => {
    const number = req.query['number'];
    if (!number || typeof number !== 'string') {
      res.send('');
    } else {
      const caller = resolveCaller(number);
      res.send(caller?.combinedName || number);
    }
  });

  console.log(TAG, `HTTP api listening...`);
}