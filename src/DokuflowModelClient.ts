import Axios, { AxiosResponse } from 'axios';

export type DokuflowDocument<T> = {
  ID: string;
} & T;

export type Operation = 'LIKE' | 'EQ' | 'IN';

export type FilterOperation<T, K extends keyof T> =
  | {
      field: K;
      operation: 'LIKE' | 'EQ';
      value: T[K];
    }
  | {
      field: K;
      operation: 'IN';
      value: T[K][];
    };

export type Pagination = {
  take?: number;
  skip?: number;
};

export enum Sort {
  EARLIEST_FIRST = 'earliest_first',
  LATEST_FIRST = 'latest_first',
}

export type SortBy<T, K extends keyof T> = {
  field: K;
  desc?: boolean;
};

export type GetListOptions<T, S extends keyof T, R extends keyof T> = {
  selections?: S[];
  filters?: FilterOperation<T, keyof T>[];
  pagination?: Pagination;
  relations?: R[];
  sort?: Sort;
  sortBy?: SortBy<T, keyof T>;
};

export type GetListResponse<T, S extends keyof T> = Promise<
  AxiosResponse<Pick<T, S>[]>
>;

export type MutationResponse<T> = {
  isSuccess: boolean;
  message: string;
  validationResult?: Record<keyof T, string>;
  result: T;
};

type DokuflowModelClientConfig = {
  baseUrl: string;
  apiKey: string;
};

class DokuflowModelClient<T> {
  constructor(readonly config: DokuflowModelClientConfig) {}

  getBaseUrl = (documentId?: string) => {
    if (documentId) {
      return `${this.config.baseUrl}/${documentId}?apiKey=${this.config.apiKey}`;
    }
    return `${this.config.baseUrl}?apiKey=${this.config.apiKey}`;
  };

  get(documentId: string): Promise<AxiosResponse<DokuflowDocument<T>>> {
    return Axios.get(this.getBaseUrl(documentId));
  }

  getList<
    S extends keyof DokuflowDocument<T>,
    R extends keyof DokuflowDocument<T>
  >(
    options: GetListOptions<DokuflowDocument<T>, S, R>
  ): GetListResponse<DokuflowDocument<T>, S> {
    let url = this.getBaseUrl();

    if (options.filters) {
      const filterQueryString = [];
      for (const filter of options.filters) {
        switch (filter.operation) {
          case 'IN':
            filterQueryString.push(
              `$$${filter.field}=${filter.operation}||${filter.value.join('|')}`
            );
            break;
          default:
            filterQueryString.push(
              `$$${filter.field}=${filter.operation}||${filter.value}`
            );
            break;
        }
      }

      if (filterQueryString.length) {
        url += '&' + filterQueryString.join('&');
      }
    }

    if (options.selections && options.selections.length) {
      url += `&select=${options.selections.join(',')}`;
    }

    if (options.pagination) {
      if (options.pagination.skip) {
        url += `&skip=${options.pagination.skip}`;
      }
      if (options.pagination.take) {
        url += `&take=${options.pagination.take}`;
      }
    }

    if (options.relations) {
      url += `&relations=${options.relations.join(',')}`;
    }

    if (options.sort) {
      url += `&sort=${options.sort}`;
    }

    if (options.sortBy) {
      url += `&sort=${options.sortBy.field}${
        options.sortBy.desc ? '||desc' : ''
      }`;
    }

    return Axios.get(url);
  }

  async getFirst<
    S extends keyof DokuflowDocument<T>,
    R extends keyof DokuflowDocument<T>
  >(options: Omit<GetListOptions<DokuflowDocument<T>, S, R>, 'pagination'>) {
    const listResponse = await this.getList({
      ...options,
      pagination: {
        take: 1,
      },
    });
    if (
      listResponse.data &&
      Array.isArray(listResponse.data) &&
      listResponse.data.length < 1
    ) {
      return null;
    }

    return listResponse.data[0];
  }

  create(
    model: Partial<T>
  ): Promise<AxiosResponse<MutationResponse<DokuflowDocument<T>>>> {
    return Axios.post(this.getBaseUrl(), model);
  }

  update(
    model: Pick<DokuflowDocument<T>, 'ID'> &
      Partial<Omit<DokuflowDocument<T>, 'ID'>>
  ): Promise<AxiosResponse<MutationResponse<DokuflowDocument<T>>>> {
    const { ID, ...modelContent } = model;
    return Axios.patch(this.getBaseUrl(ID), modelContent);
  }

  delete(
    modelId: string
  ): Promise<AxiosResponse<MutationResponse<DokuflowDocument<T>>>> {
    return Axios.delete(this.getBaseUrl(modelId));
  }
}

export default DokuflowModelClient;
