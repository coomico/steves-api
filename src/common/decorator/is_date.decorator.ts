import {
  buildMessage,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// acknowledge: https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
export function isDate(value: string): boolean {
  if (typeof value !== 'string') return false;

  const dateFullYear = /([0-9]{4})/;
  const dateMonth = /(0[1-9]|1[0-2])/;
  const dateMday = /(0[1-9]|[1-2][0-9]|3[0-1])/;
  const fullDate = new RegExp(
    `^${dateFullYear.source}-${dateMonth.source}-${dateMday.source}$`,
  );

  const match = value.match(fullDate);
  if (!match) return false;

  const [_, year, month, day] = match.map(Number);
  if (!month || !day) return false;

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

export function IsDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate: (v, _): boolean => isDate(v),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            eachPrefix +
            '$property must be a valid representation of date in the format YYYY-MM-DD.',
          validationOptions,
        ),
      },
    });
  };
}
