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

  async sendEmail(
    subject: string,
    content: string,
    email: string,
    code: string,
  ): Promise<boolean> {
    try {
      const form = new FormData();
      form.append('apiKey', this.options.apiKey);
      form.append('apiUser', this.options.apiUser);
      form.append('from', this.options.fromEmail);
      form.append('to', email);
      form.append('subject', subject);
      form.append('html', `${content} & ${code}`);
      await got.post('https://api.sendcloud.net/apiv2/mail/send', {
        body: form,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    const userName = email.split('@')[0];
    this.sendEmail('Verify Your Email', userName, email, code);
  }
}
