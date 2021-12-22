import differenceInYears from "date-fns/differenceInYears";

type Props = {
  year: number;
  // note: JS Date so month starts at 0=January
  month: number;
  day: number;
};

export const Age = ({ year, month, day }: Props) => {
  // based on https://stackoverflow.com/a/62375248/3484824
  // const years = Math.floor(
  //   (new Date().getTime() - new Date(1988, 0, 17).getTime()) /
  //     (1000 * 60 * 60 * 24 * 365),
  // );
  // done: get birthday from some config or sthg?
  const birthday = new Date(year, month, day);
  const years = differenceInYears(new Date(), birthday);
  // todo: could use rdfa, though using json-ld makes it probably unnecessary 🤔
  // return (
  //   <time property="birthDate" dateTime={`${year}-${month}-${day}`}>
  //     {years}
  //   </time>
  // );
  return <>{years}</>;
};

// alternative from https://stackoverflow.com/a/53568674/3484824
// const getAge = (dateOfBirth: string, dateToCalculate = new Date()) => {
//   const dob = new Date(dateOfBirth).getTime();
//   const dateToCompare = new Date(dateToCalculate).getTime();
//   const age = (dateToCompare - dob) / (365 * 24 * 60 * 60 * 1000);
//   return Math.floor(age);
// };
