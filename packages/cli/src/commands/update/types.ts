import { SharedArgs } from '../_shared';

export interface UpdateCommandArgs extends SharedArgs {
  packages: string[];
  force: boolean;
  next: boolean;
  'create-commits': boolean;
}
