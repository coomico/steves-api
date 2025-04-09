import {
  buildMessage,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// acknowledge:
// - https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
// - https://github.com/validatorjs/validator.js/blob/master/src/lib/isRFC3339.js
export function isTime(value: string): boolean {
  if (typeof value !== 'string') return false;

  const timeHour = /([0-1][0-9]|2[0-3])/;
  const timeMinute = /[0-5][0-9]/;
  const timeSecond = /([0-5][0-9]|60)/;
  const timeSecFrac = /(\.[0-9]+)?/;
  const partialTime = new RegExp(
    `${timeHour.source}:${timeMinute.source}:${timeSecond.source}${timeSecFrac.source}`,
  );

  const timeNumOffset = new RegExp(
    `[+-]${timeHour.source}:${timeMinute.source}`,
  );
  const timeOffset = new RegExp(`([zZ]|${timeNumOffset.source})`);
  const fullTime = new RegExp(`^${partialTime.source}${timeOffset.source}$`);

  return fullTime.test(value);
}

export function IsTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate: (v, _): boolean => isTime(v),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            eachPrefix +
            '$property must be a valid representation of time in the format RFC 3339.',
          validationOptions,
        ),
      },
    });
  };
}
