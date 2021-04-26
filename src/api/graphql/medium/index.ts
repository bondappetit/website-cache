import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { dateTimeType } from '../types';

export const mediumPostType = new GraphQLObjectType({
  name: 'MediumPostType',
  fields: {
    guid: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Global unique id',
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Title',
    },
    pubDate: {
      type: GraphQLNonNull(dateTimeType),
      description: 'Publication date',
    },
    link: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Link',
    },
    author: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Author',
    },
    thumbnail: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Thumbnail',
    },
    description: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Description',
    },
    content: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Content',
    },
  },
});
