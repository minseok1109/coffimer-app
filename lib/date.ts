/**
 * Date 객체를 로컬 시간 기준 YYYY-MM-DD 문자열로 변환한다.
 * UTC가 아닌 로컬 시간대를 사용하므로 toISOString()과 결과가 다를 수 있다.
 */
export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
