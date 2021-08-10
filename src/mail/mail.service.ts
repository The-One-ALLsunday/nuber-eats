import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  private async sendEmail(
    subject: string,
    content: string,
    email: string,
    code: string,
  ) {
    try {
      console.log('subject', subject);
      console.log('content', content);
      console.log('email', email);
      console.log('code', code);
      const form = new FormData();
      form.append('apiKey', this.options.apiKey);
      form.append('apiUser', this.options.apiUser);
      form.append('from', this.options.fromEmail);
      form.append('to', email);
      form.append('subject', subject);
      form.append('html', `${content} & ${code}`);
      await got('https://api.sendcloud.net/apiv2/mail/send', {
        method: 'POST',
        body: form,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    const userName = email.split('@')[0];
    this.sendEmail('Verify Your Email', userName, email, code);
  }
}
