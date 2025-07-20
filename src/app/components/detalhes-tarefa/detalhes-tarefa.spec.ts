import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhesTarefa } from './detalhes-tarefa';

describe('DetalhesTarefa', () => {
  let component: DetalhesTarefa;
  let fixture: ComponentFixture<DetalhesTarefa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalhesTarefa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalhesTarefa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
