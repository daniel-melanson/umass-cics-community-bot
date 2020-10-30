import { Course } from "UMass/types";
import { courseMap } from "UMass/data";

export function getCourseIdFromQuery(): string | undefined {

}

export function getCourseDependents(id: string): Array<Course> | undefined {
	if (courseMap === undefined) throw new Error("Unable to get UMass data");

	
}
