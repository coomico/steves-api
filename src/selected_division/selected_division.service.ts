import { Injectable, NotFoundException } from '@nestjs/common';
import { DivisionService } from 'src/division/division.service';
import { SelectedDivisionDTO } from 'src/common/dtos';
import { SelectedDivision } from './selected_division.entity';

@Injectable()
export class SelectedDivisionService {
  constructor(private divisionService: DivisionService) {}

  async add(newSelectedDivisions: SelectedDivisionDTO[]) {
    const selectedDivisions: SelectedDivision[] = [];

    const ids = newSelectedDivisions.map((div) => {
      return { id: div.division_id };
    });
    const idPriorityMap = new Map(
      newSelectedDivisions.map((div) => [
        div.division_id,
        {
          priority: div.priority,
          motivation_leter: div.motivation_letter,
        },
      ]),
    );

    const divs = await this.divisionService.findBy(ids, undefined, true);
    if (!divs.length) throw new NotFoundException('No divisions found!');

    divs.forEach((div) => {
      const selected = new SelectedDivision();
      selected.division = div;
      selected.priority = idPriorityMap.get(div.id)?.priority as number;
      selected.motivation_letter = idPriorityMap.get(div.id)
        ?.motivation_leter as string;
      selectedDivisions.push(selected);
    });

    // do reform the priority order, start from 1

    return selectedDivisions;
  }
}
