import { Logger } from '../../../../cli/Logger';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { formatting } from '../../../../utils/formatting';
import { validation } from '../../../../utils/validation';
import GraphCommand from '../../../base/GraphCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

export interface Options extends GlobalOptions {
  objectId?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

class AadUserSetCommand extends GraphCommand {
  public get name(): string {
    return commands.USER_SET;
  }

  public get description(): string {
    return 'Updates information about the specified user';
  }

  public allowUnknownOptions(): boolean | undefined {
    return true;
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initTypes();
    this.#initValidators();
    this.#initOptionSets();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        objectId: typeof args.options.objectId !== 'undefined',
        userPrincipalName: typeof args.options.userPrincipalName !== 'undefined',
        accountEnabled: args.options.accountEnabled
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-i, --objectId [objectId]'
      },
      {
        option: '-n, --userPrincipalName [userPrincipalName]'
      },
      {
        option: '--accountEnabled [accountEnabled]',
        autocomplete: ['true', 'false']
      }
    );
  }

  #initTypes(): void {
    this.types.boolean.push('accountEnabled');
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (args.options.objectId &&
          !validation.isValidGuid(args.options.objectId)) {
          return `${args.options.objectId} is not a valid GUID`;
        }

        return true;
      }
    );
  }

  #initOptionSets(): void {
    this.optionSets.push({ options: ['objectId', 'userPrincipalName'] });
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      const manifest: any = this.mapRequestBody(args.options);

      const requestOptions: any = {
        url: `${this.resource}/v1.0/users/${formatting.encodeQueryParameter(args.options.objectId ? args.options.objectId : args.options.userPrincipalName as string)}`,
        headers: {
          accept: 'application/json'
        },
        responseType: 'json',
        data: manifest
      };

      await request.patch(requestOptions);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }

  private mapRequestBody(options: Options): any {
    const requestBody: any = {};

    const excludeOptions: string[] = [
      'debug',
      'verbose',
      'output',
      'objectId',
      'i',
      'userPrincipalName',
      'n',
      'accountEnabled'
    ];

    if (options.accountEnabled !== undefined) {
      requestBody['AccountEnabled'] = options.accountEnabled;
    }

    Object.keys(options).forEach(key => {
      if (excludeOptions.indexOf(key) === -1) {
        requestBody[key] = `${(<any>options)[key]}`;
      }
    });
    return requestBody;
  }
}

module.exports = new AadUserSetCommand();