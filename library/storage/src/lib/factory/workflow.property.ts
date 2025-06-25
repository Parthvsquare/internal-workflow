import {
  BaseProperty,
  BooleanProperty,
  CollectionProperty,
  CredentialsSelectProperty,
  DateTimeProperty,
  FilterProperty,
  HiddenProperty,
  JsonProperty,
  MultiOptionsProperty,
  NoticeProperty,
  NumberProperty,
  OptionsProperty,
  ResourceLocatorProperty,
  StringProperty,
} from '../handler/workflow.property-schema';
import {
  IBooleanProperty,
  ICollectionProperty,
  ICredentialsSelectProperty,
  IDateTimeProperty,
  IFilterProperty,
  IHiddenProperty,
  IJsonProperty,
  IMultiOptionsProperty,
  INodeProperty,
  INoticeProperty,
  INumberProperty,
  IOptionsProperty,
  IResourceLocatorProperty,
  IStringProperty,
} from '../interface/workflow.property-schema';

export class PropertyFactory {
  static create(config: INodeProperty): BaseProperty {
    switch (config.type) {
      case 'string':
        return new StringProperty(config as IStringProperty);
      case 'number':
        return new NumberProperty(config as INumberProperty);
      case 'boolean':
        return new BooleanProperty(config as IBooleanProperty);
      case 'options':
        return new OptionsProperty(config as IOptionsProperty);
      case 'multiOptions':
        return new MultiOptionsProperty(config as IMultiOptionsProperty);
      case 'collection':
        return new CollectionProperty(config as ICollectionProperty);
      case 'resourceLocator':
        return new ResourceLocatorProperty(config as IResourceLocatorProperty);
      case 'dateTime':
        return new DateTimeProperty(config as IDateTimeProperty);
      case 'json':
        return new JsonProperty(config as IJsonProperty);
      case 'hidden':
        return new HiddenProperty(config as IHiddenProperty);
      case 'notice':
        return new NoticeProperty(config as INoticeProperty);
      case 'credentialsSelect':
        return new CredentialsSelectProperty(
          config as ICredentialsSelectProperty
        );
      case 'filter':
        return new FilterProperty(config as IFilterProperty);
      default:
        throw new Error(`Unknown property type: ${(config as any).type}`);
    }
  }

  static createMany(configs: INodeProperty[]): BaseProperty[] {
    return configs.map((config) => this.create(config));
  }
}
