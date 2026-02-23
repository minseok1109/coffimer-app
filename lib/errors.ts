export class NotCoffeeImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotCoffeeImageError';
    // Babel 트랜스파일 시 프로토타입 체인 복원 (React Native 필수)
    Object.setPrototypeOf(this, NotCoffeeImageError.prototype);
  }
}
