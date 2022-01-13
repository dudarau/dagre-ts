
export const sortBy = (arr: any[], fieldName: string) => {
    return arr.sort((a: any, b: any) => {
        const valueA = a[fieldName];
        const valueB = b[fieldName];
        if (valueA < valueB) {
            return -1;
        }
        if (valueA > valueB) {
            return 1;
        }

        // names must be equal
        return 0;
    })
}