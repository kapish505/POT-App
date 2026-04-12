import { IsString, IsOptional, IsInt, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class UpdateUserDto {
    @IsOptional() @IsString()
    name?: string;

    @IsOptional() @IsString()
    bio?: string;

    @IsOptional() @IsString()
    photoUrl?: string;

    @IsOptional() @IsInt() @Min(18) @Max(99)
    age?: number;

    @IsOptional() @IsString()
    city?: string;

    @IsOptional() @IsArray() @IsString({ each: true })
    interests?: string[];

    @IsOptional() @IsString()
    relationshipStatus?: string;

    @IsOptional() @IsBoolean()
    hasKids?: boolean;

    @IsOptional() @IsBoolean()
    wantsKids?: boolean;

    @IsOptional() @IsString()
    zodiacSign?: string;

    @IsOptional() @IsArray() @IsString({ each: true })
    languages?: string[];

    @IsOptional() @IsString()
    occupation?: string;

    @IsOptional() @IsInt() @Min(140) @Max(250)
    height?: number;

    @IsOptional() @IsArray() @IsString({ each: true })
    lifestyle?: string[];

    @IsOptional() @IsBoolean()
    profileComplete?: boolean;

    @IsOptional() @IsString()
    fcmToken?: string;
}
