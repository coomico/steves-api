export const regexNIM = /(?:\d{9,})/g;

export const getNIM = (s: string) => {
  const nim = s.match(regexNIM);
  return nim?.length === 1 ? nim[0] : undefined;
};
