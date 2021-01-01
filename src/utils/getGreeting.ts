function getGreeting(name?: string): string {
  const hours = new Date().getHours();
  let timeOfDay: string;
  if (4 <= hours && hours < 12) {
    timeOfDay = "morning";
  } else if (12 <= hours && hours < 18) {
    timeOfDay = "afternoon";
  } else {
    timeOfDay = "evening";
  }
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}!`;
}

export default getGreeting;
