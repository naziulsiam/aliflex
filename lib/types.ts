export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
  country: string;
  languages: string[];
}

export interface CategoryGroup {
  name: string;
  channels: Channel[];
}
