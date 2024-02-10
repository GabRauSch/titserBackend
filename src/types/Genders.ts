const genders = ['male', 'female', 'other', 'sensient alien robot']
export type Gender =  'Male' | 'Female' | 'Other' | 'Sensient Alien Robot'
export const isGender = (object: any)=>{
    return genders.includes(object)
}