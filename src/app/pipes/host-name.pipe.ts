import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hostName',
  standalone: true,
})
export class HostNamePipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    if (!url) {
      return '';
    }

    try {
      const hostname = new URL(url).hostname;
      return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    } catch (e) {
      return '';
    }
  }
}
