export function ErrorFormatter(msg: string, ex: any, file: string): string {
    const excpMsg = ex instanceof Error ? ex.message : '';

    let idx = file.lastIndexOf('/');
    file = file.substring(idx + 1);

    if (excpMsg.length > 0) {
        return `${msg}, File: ${file}. Error: ${excpMsg}`;
    } else {
        return `${msg} in ${file}`;
    }
}
