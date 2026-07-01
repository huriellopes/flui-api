import { Injectable } from '@nestjs/common';

import { calcTargets, type CalcInput, type DailyTargets } from './nutrition';

@Injectable()
export class NutritionService {
  compute(input: CalcInput): DailyTargets {
    return calcTargets(input);
  }
}
