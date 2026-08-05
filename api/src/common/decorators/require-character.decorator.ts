import { SetMetadata } from '@nestjs/common';
import { REQUIRE_CHARACTER_KEY } from '../constants/metadata.constants';

export const RequireCharacter = (required = true) => SetMetadata(REQUIRE_CHARACTER_KEY, required);
