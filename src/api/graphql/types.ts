import { isEthAddress } from '@models/types';
import dayjs from 'dayjs';
import {
  GraphQLError,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLScalarType,
  GraphQLType,
  GraphQLFieldConfig,
  GraphQLField,
  GraphQLObjectTypeConfig,
} from 'graphql';

export class GraphQLParseError extends GraphQLError {
  constructor(type: string, value: any) {
    super(`Field parse error: value ${value} is a invalid ${type}`);
  }
}

export const errorType = GraphQLString;

export const dateTimeType = new GraphQLScalarType({
  name: 'DateTimeType',
  description: 'Дата и время',
  parseValue: (value: string) => {
    const dateTime = dayjs(value);
    if (!dateTime.isValid()) throw new GraphQLParseError('DateTime', value);

    return dateTime;
  },
  serialize: (value: dayjs.Dayjs | Date) => {
    if (dayjs.isDayjs(value)) return value.toDate().toISOString();

    return value.toISOString();
  },
});

export const addressScalar = new GraphQLScalarType({
  name: 'AddressType',
  description: 'Ethereum wallet address',
  parseValue: (value: string) => {
    if (!isEthAddress(value)) throw new GraphQLParseError('Address', value);

    return value.toLowerCase();
  },
});
