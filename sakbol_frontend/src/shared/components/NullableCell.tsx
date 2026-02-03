export default function NullableCell({ value }: { value: any }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-500 italic">Не указано</span>;
  }
  return <>{value}</>;
}