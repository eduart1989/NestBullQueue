import { Injectable } from '@nestjs/common';

const GENERATION_DELAY = 5000;
@Injectable()
export class DelayService {
  async delay(
    ms: number = GENERATION_DELAY,
  ): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, ms),
    );
  }
}
