export type UserUpdateData = {
    customName?: string,
    description?: string,
    birthday?: Date,
    gender?: 'male' | 'female' | 'other' | 'Sensient Alien Robot',
    targetDistanceRange?: number,
    targetGender?:  'male' | 'female' | 'other' | 'Sensient Alien Robot',
    targetAgeRange?: string
} 